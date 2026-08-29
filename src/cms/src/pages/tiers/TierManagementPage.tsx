import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useTranslation } from 'react-i18next';
import { AppBreadcrumb } from 'components';
import { TenantSelector } from '@/components/TenantSelector';
import { TierLevel, CommonStatus } from '@/models';
import { LoyaltyService } from '@/service/loyalty.service';

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

export const TierManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const toastRef = useRef<Toast>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>(
    localStorage.getItem('tenant_id') || 'TENANT_NATCASH'
  );
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<TierConfig[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<TierConfig>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ép tạo mảng mới mỗi khi đổi ngôn ngữ để PrimeReact DataTable re-render 100% các ô
  const displayTiers = useMemo(
    () => tiers.map((item) => ({ ...item })),
    [tiers, i18n.language]
  );

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LoyaltyService.getTiers(selectedTenant);
      if (data && Array.isArray(data)) {
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
            status: (item.status as CommonStatus) || CommonStatus.ACTIVE,
          }))
        );
      } else {
        setTiers([]);
      }
    } catch (e) {
      console.error('[fetchTiers] Error:', e);
      setTiers([]);
      toastRef.current?.show({
        severity: 'error',
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('tier.load_failed', { defaultValue: 'Không thể tải dữ liệu hạng hội viên từ máy chủ' }),
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTenant, t]);

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const editItem = (item: TierConfig) => {
    setFormData({ ...item });
    setIsEdit(true);
    setShowDialog(true);
  };

  const saveItem = async () => {
    if (!formData.code) return;
    setIsSubmitting(true);
    try {
      await LoyaltyService.saveTier(
        {
          id: formData.id,
          code: formData.code,
          name: formData.name || formData.code,
          tierLevel: formData.tierLevel ?? 1,
          minPoints: formData.minPoints ?? 0,
          pointMultiplier: formData.pointMultiplier ?? 1.0,
          freeDailyTurns: formData.freeDailyTurns ?? 1,
          description: formData.description || '',
          status: formData.status || CommonStatus.ACTIVE,
        },
        selectedTenant
      );

      toastRef.current?.show({
        severity: 'success',
        summary: t('toast.success', { defaultValue: 'Thành công' }),
        detail: t('tier.save_success', { defaultValue: 'Cập nhật cấu hình hạng hội viên thành công' }),
        life: 3000,
      });

      setShowDialog(false);
      await fetchTiers();
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toast.error', { defaultValue: 'Lỗi' }),
        detail: t('tier.save_failed', { defaultValue: 'Cập nhật cấu hình hạng hội viên thất bại' }),
        life: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const codeTemplate = (rowData: TierConfig) => (
    <span className="font-medium text-700 font-mono" style={{ fontSize: '13px' }}>
      {rowData.code}
    </span>
  );

  const nameTemplate = (rowData: TierConfig) => (
    <span className="font-semibold text-900" style={{ fontSize: '13px' }}>
      {rowData.name}
    </span>
  );

  const levelTemplate = (rowData: TierConfig) => (
    <span className="text-700 font-mono" style={{ fontSize: '13px' }}>
      {rowData.tierLevel}
    </span>
  );

  const pointsTemplate = (rowData: TierConfig) => (
    <span className="text-800 font-mono" style={{ fontSize: '13px' }}>
      {(rowData.minPoints ?? 0).toLocaleString()}{' '}
      <span className="text-500 font-normal text-xs">{t('tier.points_unit', { defaultValue: 'điểm' })}</span>
    </span>
  );

  const multiplierTemplate = (rowData: TierConfig) => (
    <span className="text-primary font-mono font-medium" style={{ fontSize: '13px' }}>
      ×{Number(rowData.pointMultiplier ?? 1.0).toFixed(2)}
    </span>
  );

  const turnsTemplate = (rowData: TierConfig) => (
    <span className="text-700 font-mono" style={{ fontSize: '13px' }}>
      {rowData.freeDailyTurns}{' '}
      <span className="text-500 font-normal text-xs">{t('tier.turns_unit', { defaultValue: 'lượt' })}</span>
    </span>
  );

  const descriptionTemplate = (rowData: TierConfig) => (
    <span className="text-600 text-xs line-height-2" style={{ maxWidth: '16rem', display: 'inline-block' }}>
      {rowData.description || '—'}
    </span>
  );

  const statusTemplate = (rowData: TierConfig) => {
    return rowData.status === CommonStatus.ACTIVE ? (
      <Tag severity="success" value={t('common.active', { defaultValue: 'Hoạt động' })} />
    ) : (
      <Tag severity="danger" value={t('common.inactive', { defaultValue: 'Tạm dừng' })} />
    );
  };

  const statusOptions = useMemo(
    () => [
      { label: t('common.active', { defaultValue: 'Hoạt động' }), value: CommonStatus.ACTIVE },
      { label: t('common.inactive', { defaultValue: 'Tạm dừng' }), value: CommonStatus.INACTIVE },
    ],
    [t]
  );

  const header = (
    <div className="flex flex-wrap gap-3 align-items-center justify-content-between">
      <div className="flex align-items-center gap-2">
        <h4 className="m-0 text-primary font-bold">
          {t('tier.management_title', { defaultValue: 'Quản trị Hạng Hội Viên & Ma Trận Đặc Quyền' })}
        </h4>
      </div>
      <div className="flex flex-wrap align-items-center gap-2">
        <TenantSelector
          value={selectedTenant}
          onChange={(newTenantId) => {
            setSelectedTenant(newTenantId);
            localStorage.setItem('tenant_id', newTenantId);
          }}
        />
        <Button
          icon="pi pi-refresh"
          rounded
          outlined
          severity="secondary"
          onClick={fetchTiers}
          loading={loading}
          tooltip={t('common.refresh', { defaultValue: 'Làm mới' })}
        />
      </div>
    </div>
  );

  return (
    <div>
      <Toast ref={toastRef} />
      <ConfirmDialog />
      <AppBreadcrumb items={[{ label: t('nav.tiers', { defaultValue: 'Hạng Hội Viên' }) }]} />
      <div className="card shadow-1 border-round surface-card p-4">
        <DataTable<any>
          key={`${i18n.language}_${selectedTenant}`}
          value={displayTiers}
          selection={selectedTiers}
          onSelectionChange={(e: any) => setSelectedTiers(e.value || [])}
          header={header}
          loading={loading}
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
            style={{ width: '3.5rem', textAlign: 'center' }}
          />

          {/* Cột 3: Thao tác */}
          <Column
            body={actionTemplate}
            exportable={false}
            header={t('common.actions', { defaultValue: 'Thao tác' })}
            style={{ width: '5rem', textAlign: 'center' }}
          />

          {/* Cột 4 trở đi: Dữ liệu từ DB */}
          <Column field="code" body={codeTemplate} header={<span title={t('tier.code_tooltip', { defaultValue: 'Mã định danh hạng hội viên' })}>{t('tier.code', { defaultValue: 'Mã Hạng' })}</span>} sortable style={{ minWidth: '7rem' }} />
          <Column field="name" body={nameTemplate} header={<span title={t('tier.name_tooltip', { defaultValue: 'Tên cấu hình hạng hội viên' })}>{t('tier.name', { defaultValue: 'Tên Hạng' })}</span>} sortable style={{ minWidth: '13rem' }} />
          <Column field="tierLevel" body={levelTemplate} header={<span title={t('tier.level_tooltip', { defaultValue: 'Cấp độ phân hạng (1 đến 4)' })}>{t('tier.level', { defaultValue: 'Cấp Độ' })}</span>} sortable style={{ minWidth: '5.5rem', textAlign: 'center' }} />
          <Column field="minPoints" body={pointsTemplate} header={<span title={t('tier.min_points_tooltip', { defaultValue: 'Ngưỡng điểm xét hạng tích lũy trong chu kỳ 12 tháng' })}>{t('tier.min_points', { defaultValue: 'Điểm Xét Hạng' })}</span>} sortable style={{ minWidth: '9.5rem' }} />
          <Column field="pointMultiplier" body={multiplierTemplate} header={<span title={t('tier.multiplier_tooltip', { defaultValue: 'Hệ số nhân điểm thưởng khi tích điểm' })}>{t('tier.multiplier', { defaultValue: 'Hệ Số Điểm' })}</span>} sortable style={{ minWidth: '7.5rem', textAlign: 'center' }} />
          <Column field="freeDailyTurns" body={turnsTemplate} header={<span title={t('tier.free_turns_tooltip', { defaultValue: 'Số lượt quay may mắn miễn phí mỗi ngày' })}>{t('tier.free_turns', { defaultValue: 'Lượt Quay/Ngày' })}</span>} sortable style={{ minWidth: '8.5rem', textAlign: 'center' }} />
          <Column field="description" body={descriptionTemplate} header={<span title={t('tier.description_tooltip', { defaultValue: 'Mô tả quyền lợi và chính sách hạng' })}>{t('tier.description', { defaultValue: 'Mô Tả' })}</span>} style={{ minWidth: '12rem' }} />
          <Column field="status" body={statusTemplate} header={<span title={t('common.status_tooltip', { defaultValue: 'Trạng thái hoạt động' })}>{t('common.status', { defaultValue: 'Trạng Thái' })}</span>} sortable style={{ minWidth: '8rem', textAlign: 'center' }} />
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
          <label htmlFor="tierDescription" className="font-bold">{t('tier.description', { defaultValue: 'Mô tả quyền lợi' })}</label>
          <InputText
            id="tierDescription"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
